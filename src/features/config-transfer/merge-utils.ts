/**
 * JSON deep merge 工具
 *
 * 合并规则：
 * - 对象类型：递归合并，导入数据的字段覆盖同名字段，当前独有字段保留
 * - 数组类型：导入数据的数组直接替换当前数组
 * - 基本类型：导入数据覆盖当前值
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

/**
 * 深度合并两个对象。
 * incoming 中的值会覆盖 base 中的同名字段，
 * base 中独有的字段会被保留。
 */
export function deepMerge(
  base: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base }

  for (const key of Object.keys(incoming)) {
    const baseValue = base[key]
    const incomingValue = incoming[key]

    if (isPlainObject(baseValue) && isPlainObject(incomingValue)) {
      // 递归合并对象
      result[key] = deepMerge(baseValue, incomingValue)
    } else {
      // 数组、基本类型：直接覆盖
      result[key] = incomingValue
    }
  }

  return result
}
