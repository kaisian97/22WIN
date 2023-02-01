import React, {useEffect, useState} from 'react';
import {Dimensions, PermissionsAndroid, Platform} from 'react-native';
import {WebView} from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import {iso1A2Code} from '@ideditor/country-coder';

type ResponseData = {
  home_url?: string;
  display: number;
};

const App = () => {
  const [homeUrl, setHomeUrl] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [countryCode, setCountryCode] = useState('');

  const makeRequest = async ({countryCode}: {countryCode: string}) => {
    const payload: Record<string, string> = {
      m_country: countryCode,
      ip_country: countryCode,
      appcode: '22win_android',
      panel: 'main',
    };

    const qs = Object.keys(payload).reduce((str, key, idx) => {
      const sign = idx === 0 ? '?' : '&';
      return str + `${sign}${key}=${payload[key]}`;
    }, '');

    try {
      const res = await fetch(`https://api-app.22w.in/index/get-product${qs}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic d2luQXBwUm9ib3RzJSReOilBU0QqIyQlQEBGU0Q=',
        },
      });
      const resJson = await res.json();
      if (resJson) {
        const data = resJson.data as ResponseData;
        if (!data.display && data.home_url) {
          setHomeUrl(data.home_url);
        }
      }
    } catch (error) {
      console.log('get home url error', error);
    }
  };

  useEffect(() => {
    if (countryCode) {
      makeRequest({
        countryCode,
      });
    }
  }, [countryCode]);

  const getCountryCode = async () => {
    try {
      let permissionGranted = false;
      if (Platform.OS === 'ios') {
        const res = await Geolocation.requestAuthorization('whenInUse');
        permissionGranted = res === 'granted';
      } else {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        );
        permissionGranted = res === PermissionsAndroid.RESULTS.GRANTED;
      }
      if (permissionGranted) {
        Geolocation.getCurrentPosition(
          info => {
            if (info.coords) {
              const countryCode = iso1A2Code([
                info.coords.longitude,
                info.coords.latitude,
              ]);
              if (countryCode) setCountryCode(countryCode);
            }
          },
          undefined,
          {enableHighAccuracy: false, timeout: 5000, maximumAge: 10000},
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getCountryCode();
  }, []);

  return (
    <>
      {!loaded && (
        <WebView
          onLoad={() => {
            setLoaded(true);
          }}
        />
      )}
      <WebView
        style={{
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').height,
        }}
        source={{uri: homeUrl}}
      />
    </>
  );
};

export default App;
