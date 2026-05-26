using System;
using System.Threading.Tasks;

namespace Grabbe.API.Infrastructure.ExternalClients;

/// <summary>
/// A lightweight asynchronous retry helper that executes an operation and retries it if a transient failure occurs.
/// </summary>
public static class RetryHelper
{
    /// <summary>
    /// Executes an asynchronous operation with retry logic for transient failures.
    /// </summary>
    /// <typeparam name="T">The return type of the operation.</typeparam>
    /// <param name="action">The asynchronous operation to execute.</param>
    /// <param name="maxRetries">The maximum number of retry attempts.</param>
    /// <param name="delayMilliseconds">The base delay in milliseconds between retries. Multiplied by attempt number.</param>
    /// <param name="shouldRetry">A predicate determining whether the thrown exception is transient and should trigger a retry.</param>
    /// <param name="onRetry">An optional callback executed before each retry attempt.</param>
    /// <returns>The result of the operation.</returns>
    public static async Task<T> ExecuteWithRetryAsync<T>(
        Func<Task<T>> action,
        int maxRetries = 3,
        int delayMilliseconds = 1000,
        Func<Exception, bool>? shouldRetry = null,
        Action<Exception, int>? onRetry = null)
    {
        int attempt = 0;
        while (true)
        {
            try
            {
                return await action();
            }
            catch (Exception ex) when (attempt < maxRetries && (shouldRetry == null || shouldRetry(ex)))
            {
                attempt++;
                onRetry?.Invoke(ex, attempt);
                await Task.Delay(delayMilliseconds * attempt);
            }
        }
    }
}
