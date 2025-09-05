// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dmpmazdyf',
  api_key: '234966415114878',
  api_secret: 'AejX9CX9KkcK_UwAfgpFMfgfDCg', // keep in env in real projects
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {

    let folder = file.fieldname;
    return {
      folder,
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      resource_type: 'image',
      transformation: [{ quality: 'auto' }], // optimize
    };
  },
});

module.exports = { cloudinary, storage };