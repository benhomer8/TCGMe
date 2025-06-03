// Card.js
class Card {
  
  constructor(imageUri, caption, options = {}) {
    this.imageUri = imageUri;
    this.caption = caption;
    this.rarity = options.rarity || "common";
    this.isFullArt = options.isFullArt || false;
    this.createdAt = new Date().toISOString();
    this.name = options.name || "Untitled Card";
  }

  setCardName() {
    // Extract the name from the caption if it follows the format "Name ---- Description"
    if (this.caption.includes('----')) {
      const splitCaption = this.caption.split('----')
      this.name = splitCaption[0].trim();
      this.caption = splitCaption[1].trim();

    }



  }

}

export default Card;
