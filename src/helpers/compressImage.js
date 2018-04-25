/*
  type:
    expand: maximun limit
    shrink: minimun limit
    cover: maximun limit with cut
    contain: mininum limit with space
    horizontal: horizontal align
    vertical: vertical align
*/

export default function compressImage(params) {
  params.type = params.type || 'expand';
  params.fileType = params.fileType || 'jpeg';
  const {
    type,
    url,
    width,
    height,
    fileType,
  } = params;
  let {
    imgWidth,
    imgHeight,
  } = params;

  return new Promise((resolve, reject) => {
    if (!url) reject('Require url');
    if (type === 'horizontal') {
      if (!width) reject('Invalid size');
    } else if (type === 'vertical') {
      if (!height) reject('Invalid size');
    } else if (!width || !height) {
      reject('Invalid size');
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;

    new Promise((resolve, reject) => {  // Get size of image
      if (imgWidth && imgHeight) resolve();
      img.addEventListener('load', (evt) => {
        imgWidth = evt.target.width;
        imgHeight = evt.target.height;
        resolve();
      });
    })
    .then(() => {
      if (!imgWidth || !imgHeight) reject('Invalid img size');

      const cav = document.createElement('canvas');
      let bs;
      switch (type) {
        case 'expand':
        case 'cover':
          bs = Math.min(1, Math.max(width / imgWidth, height / imgHeight));
          break;
        case 'shrink':
        case 'contain':
          bs = Math.min(1, Math.min(width / imgWidth, height / imgHeight));
          break;
        case 'horizontal':
          bs = Math.min(1, width / imgWidth);
          break;
        case 'vertical':
          bs = Math.min(1, height / imgHeight);
          break;
        default:
          bs = 1;
      }
      switch (type) {
        case 'expand':
        case 'shrink':
        case 'horizontal':
        case 'vertical':
          cav.width = Math.ceil(bs * imgWidth);
          cav.height = Math.ceil(bs * imgHeight);
          break;
        default:
          cav.width = width;
          cav.height = height;
      }
      const ctx = cav.getContext('2d');
      const widthA = Math.ceil(bs * imgWidth);
      const heightA = Math.ceil(bs * imgHeight);
      ctx.drawImage(img, (cav.width - widthA) / 2, (cav.height - heightA) / 2, widthA, heightA);
      resolve(cav.toDataURL(`image/${fileType}`, 1.0));
    });
  });
}
