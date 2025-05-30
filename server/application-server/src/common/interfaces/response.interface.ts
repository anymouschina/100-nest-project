/**
 * Standard API response interface
 */
export interface ApiResponse<T> {
  /**
   * Response code
   * 0 indicates success, other values indicate specific error codes
   */
  code: number;
  
  /**
   * Response data
   * Contains the actual response payload
   */
  data: T;
  
  /**
   * Response message
   * A human-readable message describing the result
   */
  message: string;
  
  /**
   * Optional timestamp
   * Indicates when the response was generated
   */
  timestamp?: string;
  
  /**
   * Optional request path
   * The API endpoint that was called
   */
  path?: string;
} 