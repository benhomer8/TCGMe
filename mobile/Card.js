// Card.js
class Card {
  
  constructor(imageUri, caption, options = {}) {
    this.imageUri = imageUri;
    this.caption = caption;
    this.rarity = 0;
    this.isFullArt = options.isFullArt || false;
    this.isFoil = Math.random() < 1;
    this.createdAt = new Date().toDateString();
    this.name = options.name || "Untitled Card";
    this.color = options.color || "white";
    this.isSelected = false;
  }

  setCardName() {
    // Extract the name from the caption if it follows the format "Name ---- Description"
    if (this.caption.includes('----')) {
      const splitCaption = this.caption.split('----')
      this.name = splitCaption[0].trim();
      this.caption = splitCaption[1].trim();
      

    }
    else if (this.caption.includes('---')) {
      const splitCaption = this.caption.split('---')
      this.name = splitCaption[0].trim();
      this.caption = splitCaption[1].trim();
      

    }

   


    if(!(this.isFoil)){
      items = ["white", "lightsalmon", "navajowhite", "paleturquoise", "powderblue", "palegreen", "plum", "lightsteelblue", "lemonchiffon", "lavender"];
      this.color = items[Math.floor(Math.random()*items.length)];
      this.rarity = 1; // Common
    }
    else {
      this.rarity = 2; // Rare
    }

  }

}

export default Card;
