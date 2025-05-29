// Card.js
class Card {
  constructor(imageUri, caption, options = {}) {
    this.imageUri = imageUri;
    this.caption = caption;
    this.rarity = options.rarity || "common";
    this.isFullArt = options.isFullArt || false;
    this.createdAt = new Date().toISOString();
  }S
}

export default Card;
