import { UnwrapRef, ref } from 'vue'

type IUseRequestOptions<T> = {
  /** 是否立即执行 */
  immediate?: boolean
  /** 初始化数据 */
  initialData?: T
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 失败回调 */
  onError?: (error: any) => void
}

/**
 * useRequest是一个定制化的请求钩子，用于处理异步请求和响应。
 * @param func 一个执行异步请求的函数，返回一个包含响应数据的Promise。
 * @param options 包含请求选项的对象 {immediate, initialData, onSuccess, onError}。
 * @param options.immediate 是否立即执行请求，默认为false。
 * @param options.initialData 初始化数据，默认为undefined。
 * @param options.onSuccess 请求成功的回调函数。
 * @param options.onError 请求失败的回调函数。
 * @returns 返回一个对象{loading, error, data, run}，包含请求的加载状态、错误信息、响应数据和手动触发请求的函数。
 */
export default function useRequest<T>(
  func: () => Promise<IResData<T>>,
  options: IUseRequestOptions<T> = { immediate: false },
) {
  const loading = ref(false)
  const error = ref(false)
  const data = ref<T | undefined>(options.initialData)
  const run = async () => {
    loading.value = true
    return func()
      .then((res) => {
        data.value = res.data as UnwrapRef<T>
        error.value = false
        // 调用成功回调
        if (options.onSuccess) {
          options.onSuccess(res.data as T)
        }
        return data.value
      })
      .catch((err) => {
        error.value = err
        // 调用失败回调
        if (options.onError) {
          options.onError(err)
        }
        throw err
      })
      .finally(() => {
        loading.value = false
      })
  }

  options.immediate && run()
  return { loading, error, data, run }
}
