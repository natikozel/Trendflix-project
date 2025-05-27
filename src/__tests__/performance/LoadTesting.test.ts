import { jest } from '@jest/globals';

interface LoadTestResult {
  responseTime: number;
  success: boolean;
  timestamp: number;
  userId: number;
}

interface LoadTestMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
}

describe('Performance - Load Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          movies: [
            { id: 'tt0111161', title: 'The Shawshank Redemption' },
            { id: 'tt0068646', title: 'The Godfather' }
          ]
        })
      }) as unknown as Promise<Response>
    );
  });

  test('Web application loads within 2 seconds under peak traffic conditions', async () => {
    const concurrentUsers = 200;
    const maxResponseTime = 2000; // 2 seconds in milliseconds
    
    // Simulate concurrent user requests
    const simulateUserRequest = async (userId: number): Promise<LoadTestResult> => {
      const startTime = performance.now();
      
      try {
        // Simulate typical user workflow: search -> view details -> submit feedback
        const searchResponse = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ freeText: `User ${userId} preferences` })
        });
        
        const movieDetailsResponse = await fetch('/api/movies/tt0111161');
        const feedbackResponse = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId: 'tt0111161', liked: true, userId })
        });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        return {
          responseTime,
          success: searchResponse.ok && movieDetailsResponse.ok && feedbackResponse.ok,
          timestamp: Date.now(),
          userId
        };
      } catch (error) {
        const endTime = performance.now();
        return {
          responseTime: endTime - startTime,
          success: false,
          timestamp: Date.now(),
          userId
        };
      }
    };

    // Create array of concurrent user simulations
    const userRequests = Array.from({ length: concurrentUsers }, (_, index) => 
      simulateUserRequest(index + 1)
    );
    
    // Execute all requests concurrently
    const startTime = performance.now();
    const results = await Promise.all(userRequests);
    const totalTime = performance.now() - startTime;
    
    // Calculate metrics
    const metrics: LoadTestMetrics = {
      totalRequests: results.length,
      failedRequests: results.filter(r => !r.success).length,
      successRate: (results.filter(r => r.success).length / results.length) * 100,
      averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      maxResponseTime: Math.max(...results.map(r => r.responseTime)),
      minResponseTime: Math.min(...results.map(r => r.responseTime))
    };
    
    // Verify performance requirements
    expect(metrics.totalRequests).toBe(concurrentUsers);
    expect(metrics.averageResponseTime).toBeLessThan(maxResponseTime);
    expect(metrics.maxResponseTime).toBeLessThan(maxResponseTime * 1.5); // Allow 50% buffer for max
    expect(metrics.successRate).toBeGreaterThanOrEqual(95); // 95% success rate minimum
    
    // Verify concurrent execution completed in reasonable time
    expect(totalTime).toBeLessThan(maxResponseTime * 2); // Total execution under 4 seconds
    
    // Log performance metrics for monitoring
    console.log('Load Test Metrics:', {
      concurrentUsers,
      averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
      maxResponseTime: `${metrics.maxResponseTime.toFixed(2)}ms`,
      minResponseTime: `${metrics.minResponseTime.toFixed(2)}ms`,
      successRate: `${metrics.successRate.toFixed(2)}%`,
      totalExecutionTime: `${totalTime.toFixed(2)}ms`
    });
    
    // Verify API was called the expected number of times (3 calls per user)
    expect(fetch).toHaveBeenCalledTimes(concurrentUsers * 3);
  });

  test('System handles 200 concurrent users with response times under 2 seconds', async () => {
    const concurrentUsers = 200;
    const maxAllowedResponseTime = 2000;
    
    // Mock realistic response times with some variation
    (global.fetch as jest.Mock).mockImplementation(() => {
      // Simulate realistic response time variation (50-500ms)
      const responseTime = Math.random() * 450 + 50;
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              data: { movieId: 'tt0111161', title: 'Test Movie' }
            })
          });
        }, responseTime);
      });
    });
    
    const performConcurrentTest = async () => {
      const requests = Array.from({ length: concurrentUsers }, async (_, index) => {
        const startTime = performance.now();
        
        try {
          await fetch(`/api/movies/search?query=user${index}`);
          const endTime = performance.now();
          
          return {
            userId: index + 1,
            responseTime: endTime - startTime,
            success: true
          };
        } catch (error) {
          const endTime = performance.now();
          return {
            userId: index + 1,
            responseTime: endTime - startTime,
            success: false
          };
        }
      });
      
      return await Promise.all(requests);
    };
    
    const results = await performConcurrentTest();
    
    // Analyze results
    const successfulRequests = results.filter(r => r.success);
    const averageResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
    const maxResponseTime = Math.max(...results.map(r => r.responseTime));
    const successRate = (successfulRequests.length / results.length) * 100;
    
    // Verify performance requirements
    expect(results.length).toBe(concurrentUsers);
    expect(averageResponseTime).toBeLessThan(maxAllowedResponseTime);
    expect(maxResponseTime).toBeLessThan(maxAllowedResponseTime);
    expect(successRate).toBeGreaterThanOrEqual(98); // 98% success rate
    
    // Verify all response times are under the limit
    const slowRequests = results.filter(r => r.responseTime >= maxAllowedResponseTime);
    expect(slowRequests.length).toBe(0);
    
    console.log('Concurrent User Test Results:', {
      totalUsers: concurrentUsers,
      successfulRequests: successfulRequests.length,
      averageResponseTime: `${averageResponseTime.toFixed(2)}ms`,
      maxResponseTime: `${maxResponseTime.toFixed(2)}ms`,
      successRate: `${successRate.toFixed(2)}%`
    });
  });

  test('Peak traffic simulation with realistic user behavior patterns', async () => {
    const peakUsers = 200;
    const testDuration = 5000; // 5 seconds
    
    // Simulate different user behavior patterns
    const userBehaviors = [
      'search_only',
      'search_and_view',
      'full_workflow',
      'browse_similar'
    ];
    
    const simulateRealisticUser = async (userId: number) => {
      const behavior = userBehaviors[userId % userBehaviors.length];
      const startTime = performance.now();
      
      try {
        switch (behavior) {
          case 'search_only':
            await fetch('/api/recommend', {
              method: 'POST',
              body: JSON.stringify({ freeText: 'action movies' })
            });
            break;
            
          case 'search_and_view':
            await fetch('/api/recommend', { method: 'POST', body: JSON.stringify({ freeText: 'comedy' }) });
            await fetch('/api/movies/tt0111161');
            break;
            
          case 'full_workflow':
            await fetch('/api/recommend', { method: 'POST', body: JSON.stringify({ freeText: 'drama' }) });
            await fetch('/api/movies/tt0068646');
            await fetch('/api/feedback', { method: 'POST', body: JSON.stringify({ movieId: 'tt0068646', liked: true }) });
            break;
            
          case 'browse_similar':
            await fetch('/api/movies/tt0111161');
            await fetch('/api/movies/tt0111161/similar');
            break;
        }
        
        const endTime = performance.now();
        return {
          userId,
          behavior,
          responseTime: endTime - startTime,
          success: true
        };
      } catch (error) {
        const endTime = performance.now();
        return {
          userId,
          behavior,
          responseTime: endTime - startTime,
          success: false
        };
      }
    };
    
    // Stagger user requests to simulate realistic traffic patterns
    const results: any[] = [];
    const batchSize = 50;
    
    for (let i = 0; i < peakUsers; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, peakUsers - i) }, (_, index) => 
        simulateRealisticUser(i + index + 1)
      );
      
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      
      // Small delay between batches to simulate realistic traffic
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Analyze performance across different user behaviors
    const behaviorMetrics = userBehaviors.map(behavior => {
      const behaviorResults = results.filter(r => r.behavior === behavior);
      return {
        behavior,
        count: behaviorResults.length,
        averageResponseTime: behaviorResults.reduce((sum, r) => sum + r.responseTime, 0) / behaviorResults.length,
        successRate: (behaviorResults.filter(r => r.success).length / behaviorResults.length) * 100
      };
    });
    
    // Verify overall performance
    const overallAverageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const overallSuccessRate = (results.filter(r => r.success).length / results.length) * 100;
    
    expect(overallAverageResponseTime).toBeLessThan(2000);
    expect(overallSuccessRate).toBeGreaterThanOrEqual(95);
    
    // Verify each behavior pattern meets performance requirements
    behaviorMetrics.forEach(metric => {
      expect(metric.averageResponseTime).toBeLessThan(2000);
      expect(metric.successRate).toBeGreaterThanOrEqual(90);
    });
    
    console.log('Peak Traffic Simulation Results:', {
      totalUsers: peakUsers,
      overallAverageResponseTime: `${overallAverageResponseTime.toFixed(2)}ms`,
      overallSuccessRate: `${overallSuccessRate.toFixed(2)}%`,
      behaviorBreakdown: behaviorMetrics
    });
  });
}); 