import React, { Component} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ImageBackground,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat, useImageManipulator } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import Card from './Card';
import Star from './Star';
import AsyncStorage from '@react-native-async-storage/async-storage';
import  { LoadingContext }  from './LoadingContext';
import LottieView from 'lottie-react-native';

const packImage = require('./assets/images/CardPack.png');
const rainbowEffect = require('./assets/lottie_animations/rainbow_gradient.json');
const packShine = require('./assets/lottie_animations/packCover.json');
const { screenWidth, screenHeight } = Dimensions.get('window');
const starCount = 100;


class HomeScreen extends Component {

  static contextType = LoadingContext;

  constructor(props) {
    super(props);
    this.state = {
      cards: [],
      currentIndex: 0,
      img: null,
      caption: '',
      loading: false,
      allPhotos: [],
      flyAnim: new Animated.Value(0),
      packOpening: true,
      packY: new Animated.Value(0),
      starsY: new Animated.Value(0),
      stars: [],
    };
  }

  componentDidMount() {
    this.loadPhotos();
    this.startHover();
    this.setState({stars: this.generateStars()});
}

  startHover = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.state.packY, {
          toValue: -15,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(this.state.packY, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),


      ])
    ).start();
  };

  generateStars = () => {
    return Array.from({ length: starCount }).map((_, index) => ({
      id: index,
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      size: Math.random() * 4 + 2,
    }));
  };



  
  loadPhotos = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    let allAssets = [];
    let hasNextPage = true;
    let after = null;

    while (hasNextPage) {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 100,
        after,
      });

      allAssets = [...allAssets, ...media.assets];
      hasNextPage = media.hasNextPage;
      after = media.endCursor;
    }

    this.setState({ allPhotos: allAssets });
  };


  packOpened = async () => {
    const { allPhotos } = this.state;
    if (allPhotos.length === 0) {
      alert('No photos found!');
      return;
    }

    this.context.setLoading(true);
    this.setState({cards: [], currentIndex: 0 });

    const amountPerPack = 5; // Number of cards per pack
    const failedImageIds = new Set();

    const createSingleCard = async () => {
      let attempts = 0;
      while (attempts < 5) {
        try {
          const randomIndex = Math.floor(Math.random() * allPhotos.length);
          const selected = allPhotos[randomIndex];

          if (failedImageIds.has(selected.id)) {
            attempts++;
            continue;
          }

          const assetInfo = await MediaLibrary.getAssetInfoAsync(selected.id);
          const imageUri = assetInfo.localUri || assetInfo.uri;
          

          const result = await manipulateAsync(
            imageUri,
            [],
            {
              compress: 0.1,
              format: SaveFormat.WEBP,
            }
          );

          const resizedUri = result.uri;

          const base64 = await FileSystem.readAsStringAsync(resizedUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const caption = await this.uploadBase64Image(base64);

          if (!caption || (!(caption.toLowerCase().includes("--")))) {
            failedImageIds.add(selected.id);
            attempts++;
            continue;
          }

          const card = new Card(imageUri, caption, {
            rarity: 'common',
            isFullArt: false,
          });

          card.setCardName();
          this.saveCard(card);
          return card;
        } catch (error) {
          console.error('Error generating card:', error);
          attempts++;
        }
      }
      console.log('Failed to generate card after 5 attempts');
      return null;
    };

    // Generate all cards concurrently
    const cardPromises = Array.from({ length: amountPerPack }, () => createSingleCard());
    const resolvedCards = await Promise.all(cardPromises);
    const validCards = resolvedCards.filter(card => card !== null);

    this.context.setLoading(false);
    this.setState({ cards: validCards,currentIndex: 0 });
  };

  uploadBase64Image = async (base64) => {
    try {
      const payload = {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this image similar to a pokemon or yu-gi-oh in a short description following the format of Name of Card ---- Description make sure name of card comes first then 4 dashes(-) ---- into description'
              },
              { type: 'image_url', image_url: { url: `data:image/webp;base64,${base64}` } },
            ],
          },
        ],
      };


      const response = await fetch('http://192.168.1.18:5000/api/photo/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      const json = await response.json();
      return json.caption;
    } catch (error) {
      console.error(error);
      return '';
    }
  };

 

  saveCard = async (newCard) => {
    try {
      const existing = await AsyncStorage.getItem('cards');
      const cards = existing ? JSON.parse(existing) : [];
      cards.push(newCard);
      await AsyncStorage.setItem('cards', JSON.stringify(cards));
      console.log('Card saved!');
      console.log(newCard.isFoil);
    } catch (e) {
      console.error('Failed to save card:', e);
    }
  };

  revealNextCard = () => {
    const { currentIndex, cards } = this.state;

    if (currentIndex < cards.length - 1) {
      Animated.timing(this.state.flyAnim, {
        toValue: -screenHeight,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Immediately move to the next card and reset animation
        this.setState(
          prev => ({
            currentIndex: prev.currentIndex + 1,
            flyAnim: new Animated.Value(0), // Reset instantly
          })
        );
      });
    }else{
      this.setState({ packOpening: true, cards: [] });
      this.startHover();
    }
  };

  animatePackOpen = () => {
    this.animateStarsDown();
    Animated.timing(this.state.packY, {
      toValue: -600, // move up by 300 pixels
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // starts after animation
      this.setState({ packOpening: false, packY: new Animated.Value(0) }); // or trigger card reveal
      this.packOpened();
    });
  };

  animateStarsDown = () => {
    Animated.timing(this.state.starsY, {
      toValue: screenHeight,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  render() {
  const { cards, currentIndex, loading, flyAnim, packOpening, packY, stars, starsY } = this.state;

return (
  
  
  <View style={styles.container}>

    <Animated.View
      style={{
        ...StyleSheet.absoluteFillObject,
        transform: [{ translateY: starsY }],
      }}
    >
      {stars.map(star => (
        <Star key={star.id} x={star.x} y={star.y} size={star.size} />
      ))}
    </Animated.View>


    {packOpening && (
      <TouchableOpacity onPress={this.animatePackOpen}>
        <Animated.View style={{ transform: [{ translateY: packY }], justifyContent: 'center',  // center children
          alignItems: 'center', position: 'relative', width:200, height: 300} }>

          <Image
            source={packImage}
            style={{
            width: '100%',
            height: '100%',
            alignSelf: 'center',
            resizeMode: 'contain',
            position: "absolute",
          }}
          />

          <LottieView
            source={packShine}
            autoPlay
            loop
            speed={0.5}
            style={{width: '100%',
                    height: '100%',
                    alignSelf: 'center',
                    resizeMode: 'contain',
                    position: "absolute",
                    opacity: 0.2,
                  }}
          />

        </Animated.View>
      </TouchableOpacity>
    )}
        
     

    {this.context.isLoading && (
      <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
    )}

    
    {cards.length > 0 && (
      <TouchableOpacity onPress={this.revealNextCard} activeOpacity={0.9}>
        <View style={styles.cardContainer}>
          {cards.map((card, index) => {
            // Skip cards already revealed
            if (index < currentIndex) return null;

            const isTopCard = index === currentIndex;
            const animatedStyle = isTopCard
              ? { transform: [{ translateY: this.state.flyAnim }] }
              : {};

            return (

              <Animated.View
                key={index}
                style={[
                  styles.card,
                  {
                    zIndex: cards.length - index, // stack order
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  animatedStyle,
                ]}
              >
                
                {card.isFoil && (
                <LottieView
                    source={rainbowEffect}
                    autoPlay
                    loop
                    style={styles.rainbowRareEffect}
                  />
                )}

                {/* Card content */}
                <View style={styles.cardContent}>

                  <Text style={styles.namePlaceholder}>
                    {card.name || 'Card Name'}
                  </Text>

                  <Image
                    source={{ uri: card.imageUri }}
                    style={styles.cardImage}
                  />

                  <Text style={styles.caption}>{card.caption}</Text>

                </View>
              </Animated.View>

            );
          })}
        </View>
      </TouchableOpacity>
    )}
  </View>

);

}

}

const styles = StyleSheet.create({
  container: {    
    flex: 1,
    resizeMode: 'cover',       // fill the screen
    justifyContent: 'center',  // center children
    alignItems: 'center',
    backgroundColor: '#000',   // fallback black
  },

  cardContainer: {
  width: '100%',
  height: 400,
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  },
  
  card: {
  backgroundColor: '#fff',
  borderRadius: 10,
  height: 400,
  width: 300,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
  overflow: 'hidden', 
  position: 'absolute',
  },
  
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
 
  caption: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  namePlaceholder: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },

  rainbowRareEffect: {
  opacity: 0.3, 
  zIndex: 1,
  width: '200%',
  height: '200%',
  position: 'absolute',
  resizeMode: 'cover', // cover the card
  overflow: 'hidden', // ensure it doesn't overflow
  },

  
  cardContent: {
    zIndex: 2, // makes sure content is above the foil animation
    position: 'absolute',
  },


});

export default HomeScreen;
