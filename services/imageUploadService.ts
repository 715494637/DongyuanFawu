/**
 * 图片上传服务模块
 * 支持 ImageBB 免费图床
 */

class ImageUploadService {
  private imagebbApiKey: string;

  constructor() {
    // ImageBB API Key - 建议从环境变量获取
    this.imagebbApiKey = import.meta.env.VITE_IMAGEBB_API_KEY || '';
  }

  /**
   * 上传图片到 ImageBB
   * @param base64Data base64 编码的图片数据 (不包含 data:image/...;base64, 前缀)
   * @returns Promise<string> 返回图片 URL
   */
  async uploadToImageBB(base64Data: string): Promise<string> {
    if (!this.imagebbApiKey) {
      throw new Error('ImageBB API Key 未配置，请在环境变量中设置 VITE_IMAGEBB_API_KEY');
    }

    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('key', this.imagebbApiKey);
      formData.append('image', base64Data);
      formData.append('type', 'base64');
      formData.append('name', `upload_${Date.now()}`);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`ImageBB 上传失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // 返回直接图片链接
        return result.data.url;
      } else {
        throw new Error(`ImageBB API 错误: ${result.error?.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      throw error;
    }
  }

  /**
   * 转换 base64 数据为 ImageBB 需要的格式
   * @param fullBase64 完整的 base64 数据 (如 data:image/jpeg;base64,/9j/4AA...)
   * @returns 纯 base64 数据
   */
  private extractBase64Data(fullBase64: string): string {
    // 移除 data:image/...;base64, 前缀
    return fullBase64.split(',')[1] || fullBase64;
  }

  /**
   * 上传图片并返回 URL
   * @param base64Image 完整的 base64 图片数据
   * @returns Promise<string> 图片 URL
   */
  async uploadImage(base64Image: string): Promise<string> {
    const base64Data = this.extractBase64Data(base64Image);
    return await this.uploadToImageBB(base64Data);
  }

  /**
   * 获取 ImageBB 使用统计信息
   */
  async getUsageStats(): Promise<any> {
    if (!this.imagebbApiKey) {
      throw new Error('ImageBB API Key 未配置');
    }

    try {
      const response = await fetch(`https://api.imgbb.com/1/stats?key=${this.imagebbApiKey}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取使用统计失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const imageUploadService = new ImageUploadService();
export default imageUploadService;