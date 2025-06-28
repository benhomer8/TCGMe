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
import AsyncStorage from '@react-native-async-storage/async-storage';
import  { LoadingContext }  from './LoadingContext';
import LottieView from 'lottie-react-native';
import { Video } from 'expo-av';

const packImage = require('./assets/images/CardPack.png');
const rainbowEffect = require('./assets/lottie_animations/rainbow_gradient.json');
const starFall = require('./assets/videos/starFall.mp4');
const packShine = require('./assets/lottie_animations/packCover.json');
const { screenWidth, screenHeight } = Dimensions.get('window');

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
      shouldPlay: false,
    };
  }

  componentDidMount() {
    this.loadPhotos();
    this.startHover();
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


      const response = await fetch('https://35cc-76-149-175-113.ngrok-free.app/api/photo/upload', {
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
      this.setState({ packOpening: true, cards: [], shouldPlay: false });
      this.startHover();
    }
  };

  animatePackOpen = () => {
    
    this.setState({ shouldPlay: true });

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

  

  render() {
  const { cards, currentIndex, loading, flyAnim, packOpening, packY, shouldPlay } = this.state;

return (
  
  
  <View style={styles.container}>

    


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

  cardContent: {
      zIndex: 2,
      position: 'absolute',
      alignItems: 'center',
      width: '100%',
      height: '100%',
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
  overflow: 'hidden', 
  position: 'absolute',
  },
  
  cardImage: {
    width: '90%',
    height: '50%',
    borderRadius: 7,
    marginBottom: "5%",
    marginTop: '3%',
  },
 
  caption: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    marginBottom: 2,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: '95%',
  },
  
  namePlaceholder: {
    fontSize: 18,
    color: 'black',
    maxWidth: '95%',
    maxHeight: '10%',
    textAlign: "center",
    marginTop: '7%',
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

  
  

  starLottie: {
    width: '200%',
    height: '200%',
    position: 'absolute',
    resizeMode: 'cover', // cover the card
    overflow: 'hidden', // ensure it doesn't overflow
  },


});

export default HomeScreen;
