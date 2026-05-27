import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAppContext } from '../context/AppContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppTabs: React.FC = () => (
  <Tab.Navigator
    initialRouteName="Home"
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;
        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Inventory':
            iconName = focused ? 'inventory' : 'inventory-outline';
            break;
          case 'Analysis':
            iconName = focused ? 'brain' : 'brain';
            break;
          case 'Profile':
            iconName = focused ? 'account' : 'account-outline';
            break;
          default:
            iconName = 'circle';
        }
        return <Icon source={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#1a73e8',
      tabBarInactiveTintColor: '#666',
      headerStyle: {
        backgroundColor: '#1a73e8',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
    <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: '库存' }} />
    <Tab.Screen name="Analysis" component={AnalysisScreen} options={{ title: 'AI分析' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isLoggedIn, isLoading } = useAppContext();
  const [initialChecked, setInitialChecked] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading) {
      setInitialChecked(true);
    }
  }, [isLoading]);

  if (!initialChecked) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="App" component={AppTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
