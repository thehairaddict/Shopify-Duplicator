import axios from 'axios';
import Bottleneck from 'bottleneck';
import { config } from '../../config/index.js';

export class ShopifyClient {
  constructor(storeUrl, accessToken, apiKey = null, apiSecret = null) {
    this.storeUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.accessToken = accessToken;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.apiVersion = config.shopify.apiVersion;
    
    this.restLimiter = new Bottleneck({
      reservoir: 40,
      reservoirRefreshAmount: 40,
      reservoirRefreshInterval: 1000,
      maxConcurrent: 1,
      minTime: 500,
    });
    
    this.graphqlLimiter = new Bottleneck({
      reservoir: 50,
      reservoirRefreshAmount: 50,
      reservoirRefreshInterval: 1000,
      maxConcurrent: 1,
      minTime: 100,
    });
  }

  async restRequest(method, endpoint, data = null, retries = 3) {
    return this.restLimiter.schedule(async () => {
      try {
        const url = `https://${this.storeUrl}/admin/api/${this.apiVersion}${endpoint}`;
        
        const response = await axios({
          method,
          url,
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
          data,
        });

        return response.data;
      } catch (error) {
        if (error.response?.status === 429 && retries > 0) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '2', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.restRequest(method, endpoint, data, retries - 1);
        }
        throw error;
      }
    });
  }

  async graphqlRequest(query, variables = {}, retries = 3) {
    return this.graphqlLimiter.schedule(async () => {
      try {
        const url = `https://${this.storeUrl}/admin/api/${this.apiVersion}/graphql.json`;
        
        const response = await axios.post(
          url,
          { query, variables },
          {
            headers: {
              'X-Shopify-Access-Token': this.accessToken,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.errors) {
          throw new Error(JSON.stringify(response.data.errors));
        }

        const throttleStatus = response.extensions?.cost?.throttleStatus;
        if (throttleStatus?.currentlyAvailable < 10) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return response.data.data;
      } catch (error) {
        if (error.response?.status === 429 && retries > 0) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '2', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.graphqlRequest(query, variables, retries - 1);
        }
        throw error;
      }
    });
  }

  async get(endpoint) {
    return this.restRequest('GET', endpoint);
  }

  async post(endpoint, data) {
    return this.restRequest('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return this.restRequest('PUT', endpoint, data);
  }

  async delete(endpoint) {
    return this.restRequest('DELETE', endpoint);
  }

  async testConnection() {
    try {
      await this.get('/shop.json');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errors || error.message 
      };
    }
  }

  async getAllPages(endpoint, resourceKey) {
    let allItems = [];
    let nextPageInfo = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const url = nextPageInfo 
        ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}page_info=${nextPageInfo}`
        : `${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=250`;

      const response = await this.restRequest('GET', url);
      const items = response[resourceKey] || [];
      allItems = allItems.concat(items);

      const linkHeader = response.headers?.link;
      if (linkHeader) {
        const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
        if (nextLink) {
          const match = nextLink.match(/page_info=([^&>]+)/);
          nextPageInfo = match ? match[1] : null;
          hasNextPage = !!nextPageInfo;
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }
    }

    return allItems;
  }
}
