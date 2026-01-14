/**
 * Utility functions for handling timeouts and cancellable operations
 */

/**
 * Creates a cancellable promise with timeout
 * @param {Function} asyncFn - The async function to execute
 * @param {Array} args - Arguments to pass to the async function
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {boolean} supportsCancellation - Whether the function supports cancellation token
 * @returns {Promise} A promise that resolves with the result or rejects on timeout
 */
export const cancellablePromiseWithTimeout = (asyncFn, args = [], timeoutMs = 30000, supportsCancellation = false) => {
  return new Promise((resolve, reject) => {
    // Create a cancellation token
    const cancellationToken = { cancelled: false };

    // Create the timeout timer
    const timeoutId = setTimeout(() => {
      cancellationToken.cancelled = true;
      reject(new Error(`TIMEOUT: Operation took longer than ${timeoutMs}ms`));
    }, timeoutMs);

    // Run in next tick to allow timeout to be effective for sync functions
    setTimeout(() => {
      if (cancellationToken.cancelled) return;

      try {
        // Execute the function with or without cancellation token
        let functionCall;
        if (supportsCancellation) {
          functionCall = asyncFn(...args, cancellationToken);
        } else {
          functionCall = asyncFn(...args);
        }

        // Check if the result is a Promise (async function) or a regular value (sync function)
        if (functionCall && typeof functionCall.then === 'function') {
          // It's a Promise - handle it asynchronously
          functionCall
            .then(result => {
              clearTimeout(timeoutId);
              if (!cancellationToken.cancelled) {
                resolve(result);
              }
            })
            .catch(error => {
              clearTimeout(timeoutId);
              if (!cancellationToken.cancelled) {
                reject(error);
              }
            });
        } else {
          // It's a synchronous result - resolve immediately
          clearTimeout(timeoutId);
          if (!cancellationToken.cancelled) {
            resolve(functionCall);
          }
        }
      } catch (error) {
        // Handle synchronous errors
        clearTimeout(timeoutId);
        if (!cancellationToken.cancelled) {
          reject(error);
        }
      }
    }, 0);
  });
};

/**
 * Executes an async function with a timeout
 * @param {Function} asyncFn - The async function to execute
 * @param {Array} args - Arguments to pass to the async function
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {boolean} supportsCancellation - Whether the function supports cancellation token (default: false)
 * @returns {Promise} A promise that resolves with the result or rejects on timeout
 */
export const executeWithTimeout = async (asyncFn, args = [], timeoutMs = 30000, supportsCancellation = false) => {
  return cancellablePromiseWithTimeout(asyncFn, args, timeoutMs, supportsCancellation);
};

/**
 * Creates a timeout promise that can be used with Promise.race
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} message - Optional timeout message
 * @returns {Promise} A promise that rejects after timeout
 */
export const createTimeoutPromise = (timeoutMs, message = 'Operation timed out') => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeoutMs);
  });
};