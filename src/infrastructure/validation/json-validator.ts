import Ajv from "ajv"
import addFormats from "ajv-formats"

export class JsonValidator {
  private ajv: Ajv

  constructor() {
    this.ajv = new Ajv({
      allErrors: true, // Trả về tất cả các lỗi thay vì dừng ở lỗi đầu tiên
      strict: false,
      useDefaults: true,
    })
    addFormats(this.ajv)
  }

  /**
   * Xác thực dữ liệu JSON đối chiếu với JSON Schema
   */
  validateSchema(
    schema: Record<string, any>,
    data: unknown
  ): { isValid: boolean; errors?: string[] } {
    try {
      const validate = this.ajv.compile(schema)
      const valid = validate(data)

      if (valid) {
        return { isValid: true }
      }

      const errors = validate.errors?.map((err) => {
        const path = err.instancePath ? `Field '${err.instancePath.substring(1)}'` : "Root"
        return `${path} ${err.message} (Value: ${JSON.stringify(err.data)})`
      })

      return {
        isValid: false,
        errors: errors || ["Unknown validation error"],
      }
    } catch (error: any) {
      return {
        isValid: false,
        errors: [`Schema compilation failed: ${error.message}`],
      }
    }
  }
}
