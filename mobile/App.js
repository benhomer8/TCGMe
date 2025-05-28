import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Button,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      img: null,
      caption: '',
      loading: false,
      photosLoading: true,
      allPhotos: [], 
    };
  }

  componentDidMount() {
    console.log('Component mounted. Calling loadPhotos...');
    this.loadPhotos();
  }

  loadPhotos = async () => {

    this.setState({ photosLoading: true });

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

    this.setState({ allPhotos: allAssets, photosLoading: false });
  };

  getRandomImage = async () => {
    const { allPhotos } = this.state;
    if (!allPhotos.length) {
      alert('No photos loaded yet.');
      return;
    }

    try {
      const randomIndex = Math.floor(Math.random() * allPhotos.length);
      const selected = allPhotos[randomIndex];
      const assetInfo = await MediaLibrary.getAssetInfoAsync(selected.id);
      const fileUri = assetInfo.localUri || assetInfo.uri;

      this.setState(
        {
          img: { uri: fileUri },
          caption: '',
        },
        () => {
          this.uploadImage(fileUri);
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  uploadImage = async (fileUri) => {
    try {
      this.setState({ loading: true });

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch('http://100.100.100.72:5000/api/photo/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();
      this.setState({ caption: json.caption });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { img, caption, loading, photosLoading } = this.state;
    if (photosLoading) {
      return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading your photos...</Text>
      </View>
      );
    }
    
    return (
      <View style={styles.container}>
        {img && (
          <Image
            style={styles.image}
            source={{ uri: img.uri }}
          />
        )}



        <Button title="🎲 Get Random Image" onPress={this.getRandomImage} />

        {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

        {caption !== '' && (
          <View style={styles.card}>
            <Text style={styles.cardText}>{caption}</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  image: { width: 300, height: 300, resizeMode: 'cover', marginVertical: 20 },
  card: { marginTop: 20, padding: 15, backgroundColor: '#eee', borderRadius: 10 },
  cardText: { fontSize: 16, fontStyle: 'italic' },
});
