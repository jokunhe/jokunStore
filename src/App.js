import React, { Component, PureComponent } from 'react'
import { StyleSheet, Text, View, FlatList, Image, SafeAreaView, ScrollView, TextInput, Animated } from 'react-native'
import { getFetchFromCache } from './utils/Request/HttpExtension'
// eslint-disable-next-line
import Spinner from 'react-native-spinkit'
import SplashScreen from 'react-native-splash-screen'
export default class App extends Component {
  constructor(props) {
    SplashScreen.hide()
    super(props)
    this.state = {
      nowData: [],
      topData: []
    }
    this.page = 1
    this.start = 0
    this.allData = []
    this.isLoding = false
    this.isPlay = false
    this.opacity = new Animated.Value(1)
  }

  componentDidMount() {
    this.getAllData()
    this.getTopData()
  }

  getAllData = () => {
    if (this.isLoding) {
      return
    }
    this.isLoding = true
    getFetchFromCache('http://localhost:8081/all.json').then(
      response => {
        this.allData = response.feed.entry
        const nowData = this.allData.slice(this.start, this.page * 20)
        this.start += 20
        this.page += 1
        this.setState({
          nowData
        })
        this.isLoding = false
      },
      () => {}
    )
  }

  getTopData = () => {
    getFetchFromCache('http://localhost:8081/top.json').then(
      response => {
        this.setState({
          topData: response.feed.entry
        })
      },
      () => {}
    )
  }

  keyExtractor = item => item.id.attributes[`im:id`].toString()

  renderItem = ({ item, index }) => {
    const uri = item['im:image'][0].label
    const name = item['im:name'].label
    const typeName = item.category.attributes.label
    const isOdd = index % 2 !== 0 
    return (
      <View key={index} style={styles.itemView}>
        <Image source={{ uri }} style={[styles.itemImage, isOdd && { borderRadius: 26 }]} />
        <View style={styles.itemViewContainer}>
          <Text style={styles.nameText} >{name}</Text>
          <Text style={styles.typeNameText} >{typeName}</Text>
          {/* 因为取不到对应的star 故只有这样 */}
          <Star ratingNum={index} />
        </View>
      </View>
    )
  }

  returnTopItem = () => {
    const { topData } = this.state
    const topItem = []
    topData.map((item, index) => {
      const uri = item['im:image'][0].label
      const name = item['im:name'].label
      const typeName = item.category.attributes.label
      topItem.push(
        <View key={index} style={styles.headerItemView}>
          <Image source={{ uri }} style={styles.itemImage} />
          <View style={styles.headerItemTextView}>
            <Animated.Text style={[styles.nameText, {height: 36, opacity: this.opacity}]} numberOfLines={2} >{name}</Animated.Text>
            <Animated.Text style={styles.typeNameText} >{typeName}</Animated.Text>
          </View>
        </View>
      )
    })
    return topItem
  }

  listHeaderComponent = () => {
    return (
      <View style={styles.headerView}>
        <Text style={styles.headerText}>前10总票房应用</Text>
        <ScrollView onScrollEndDrag={this.play}  horizontal showsHorizontalScrollIndicator={false}>
          {this.returnTopItem()}
        </ScrollView>
      </View>
    )
  }

  listEmptyComponent = () => {
    return (
      <View style={styles.emptyView}>
        <Spinner isVisible={true} size={40} type={'Pulse'} color={'#222'} />
      </View>
    )
  }

  listFooterComponent = () => {
    return this.page < 5 ? (
      <View style={styles.emptyView}>
        <Spinner isVisible={true} size={40} type={'Pulse'} color={'#222'} />
      </View>
    ) : null
  }

  onEndReached = () => {
    this.page < 5 && this.getMoreData()
  }

  getMoreData = () => {
    if (this.isLoding) return
    this.isLoding = true
    const moreData = this.allData.slice(this.start, this.page * 20)
    this.start += 20
    this.page += 1
    setTimeout(() => {
      // 此延迟纯粹是为了模拟网络
      this.setState(
        {
          nowData: [...this.state.nowData, ...moreData]
        },
        () => {
          this.isLoding = false
        }
      )
    }, 3000)
  }

  onEndEditing = () => {
    this.getSeachData(this.state.text)
  }

  getSeachData = text => {
    // TODO: 这边执行搜索，拿到数据后更改nowData的值进行重新渲染
  }

  play = () => {
    if (this.isPlay) {
      return
    }
    this.isPlay = true
    Animated.timing(this.opacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      isInteraction: false
    }).start(() => {
      Animated.timing(this.opacity, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        isInteraction: false
      }).start(() => {
        this.isPlay = false
      })
    })
    // 恕在下实在想不到更有趣的动画
  }

  render() {
    const { topData, nowData } = this.state
    console.log(this.opacity)
    return (
      <SafeAreaView style={styles.container}>
        <TextInput
          clearButtonMode={'always'}
          placeholderTextColor="#C8C8C8"
          style={styles.textInput}
          maxLength={30}
          underlineColorAndroid="transparent"
          autoFocus={true}
          placeholder="输入即可搜索"
          onChangeText={text => this.setState({ text })}
          onEndEditing={this.onEndEditing}
        />
        <FlatList
          bounces={false}
          showsVerticalScrollIndicator={false}
          data={nowData}
          extraData={topData}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          ListHeaderComponent={!!topData.length && this.listHeaderComponent}
          ListFooterComponent={this.listFooterComponent}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={2}
        />
      </SafeAreaView>
    )
  }
}

class Star extends PureComponent {
  returnStar = () => {
    const { ratingNum } = this.props
    const star = []
    let num = ratingNum
    if (ratingNum > 5) num = 5
    Array.from({ length: num }).map((_item, index) => {
      star.push(<Image key={index} style={styles.starImage} source={require('../assets/images/select_star.png')} />)
    })
    if (ratingNum < 5) {
      Array.from({ length: 5 - ratingNum }).map((item, index) => {
        star.push(
          <Image key={index + 5} style={styles.starImage} source={require('../assets/images/unSelect_star.png')} />
        )
      })
    }
    return star
  }

  render() {
    return <View style={{ flexDirection: 'row' }}>{this.returnStar()}</View>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  nameText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 6
  },
  typeNameText: {
    fontSize: 12,
    color: '#999'
  },
  headerView: {
    alignItems: 'center',
    marginBottom: 20
  },
  headerItemView: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    marginHorizontal: 10
  },
  headerItemTextView: {
    alignItems: 'flex-start'
  },
  headerText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8
  },
  itemView: {
    flexDirection: 'row',
    marginBottom: 8,
    marginLeft: 8
  },
  itemImage: {
    height: 64,
    width: 64,
    marginRight: 8,
    borderRadius: 8
  },
  itemViewContainer: {
    justifyContent: 'space-between'
  },
  textInput: {
    height: 28,
    backgroundColor: '#F7F7F7',
    fontSize: 13,
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 20,
    paddingHorizontal: 15,
    textAlign: 'center',
    textAlignVertical: 'top',
    color: '#666666'
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  starImage: {
    width: 20,
    height: 20
  }
})
