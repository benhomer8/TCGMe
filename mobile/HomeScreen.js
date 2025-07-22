import React, { Component} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Easing,
  ImageBackground,
  Animated,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat, useImageManipulator } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import Card from './Card';
import AsyncStorage from '@react-native-async-storage/async-storage';
import  { LoadingContext }  from './LoadingContext';
import LottieView from 'lottie-react-native';
import BackgroundSVG from './BackgroundSVG';
import LogoSVG from './LogoSVG';
import InteractiveCard from './InteractiveCard';


const packImage = require('./assets/images/CardPack.png');
const background = require('./assets/lottie_animations/backgroundgradient.json');
const packShine = require('./assets/lottie_animations/packCover.json');
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

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

    const amountPerPack = 3; // Number of cards per pack
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
          if (card.name.length > 22) {
            attempts++;
            continue;
          }


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
    const cardsWithAnim = validCards.map(card => ({
      ...card,
      flyAnim: new Animated.Value(0),
    }));
    this.context.setLoading(false);
    this.setState({ cards: cardsWithAnim,currentIndex: 0 });
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


      const response = await fetch('https://tcgme.onrender.com/api/photo/upload', {
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

      const topCardAnim = cards[currentIndex].flyAnim;
      cards[currentIndex].isSelected = false;

      Animated.timing(topCardAnim, {
        toValue: -screenHeight,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        
        // Immediately move to the next card and reset animation
        this.setState(
          prev => ({
            currentIndex: prev.currentIndex + 1,
          })
        );
        cards[currentIndex].isSelected = true;
      });
    }else{
      cards[currentIndex].isSelected = true;
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
  const { cards, currentIndex, packOpening, packY, } = this.state;

return (
  
  
  <View style={styles.container}>

    <LottieView
      source={background}
            autoPlay
            loop
            speed={0.5}
            style={{width: '150%',
                    height: '150%',
                    position: "absolute",
                  }}>
    </LottieView>


    {packOpening && (
      <TouchableOpacity onPress={this.animatePackOpen}>
        <Animated.View style={{ transform: [{ translateY: packY }], justifyContent: 'center',  // center children
          alignItems: 'center', position: 'relative', width:200, height: 300} }>

          <Image
            source={packImage}
            style={{
            width: '150%',
            height: '150%',
            alignSelf: 'center',
            resizeMode: 'contain',
            position: "absolute",
            shadowColor: 'black',
            shadowOffset: 20,
            shadowRadius: 10,
            shadowOpacity: 10,
          }}
          />

          <LottieView
            source={packShine}
            autoPlay
            loop
            speed={.8}
            style={{width: '150%',
                    height: '150%',
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
              ? { transform: [{ translateY: card.flyAnim }] }
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
                <InteractiveCard selectedCard={{ ...card, isSelected: true }} CARD_HEIGHT={screenHeight * 0.5} CARD_WIDTH={screenWidth * 0.8}></InteractiveCard>
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
  height: '80%',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  },
  
  card: {
  backgroundColor: 'transparent',
  position: 'absolute',
  },
  
  
 
  
  

  
  



});

export default HomeScreen;
