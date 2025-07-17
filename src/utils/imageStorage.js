export class ImageStorage {
  static generateId() {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async storeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imageId = this.generateId();
        const imageData = {
          id: imageId,
          data: reader.result,
          name: file.name,
          size: file.size,
          type: file.type,
          timestamp: Date.now()
        };
        
        try {
          localStorage.setItem(`ghost_image_${imageId}`, JSON.stringify(imageData));
          console.log('📦 Stored image in localStorage:', imageId);
          resolve(imageData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static getImage(imageId) {
    try {
      const data = localStorage.getItem(`ghost_image_${imageId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving image:', error);
      return null;
    }
  }

  static deleteImage(imageId) {
    try {
      localStorage.removeItem(`ghost_image_${imageId}`);
      console.log('🗑️ Deleted image from localStorage:', imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}
