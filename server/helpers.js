const request = require('request');

let getNamesAndKeys = (cityName, foodType, callback) => {
  var splitFood = foodType.split(' '); // "pepperoni pizza" --> ['pepperoni', 'pizza']
  let query = {
    headers: {'X-Access-Token': '0c8f1aa53d894030'},
    url: 'https://api.eatstreet.com/publicapi/v1/restaurant/search?method=both&pickup-radius=10&street-address=' + cityName
  };
  request.get(query, (error, response, body) => {
    if (error) {
      console.log('ERROR GETTING eatstreet DATA');
    } else {
      var formattedData = formatRestaurantData(body, splitFood);
      callback(formattedData);
    }
  });
};

let formatRestaurantData = (body, searchedFood) => {
  var res = JSON.parse(body);
  var restaurants = res.restaurants;
  var namesAndKeys = [];
  restaurants.forEach( (restaurant) => {
    searchedFood.forEach( (type) => {
      if (restaurant.foodTypes.includes(type)) {
        namesAndKeys.push({name: restaurant.name, location: restaurant.city, apiKey: restaurant.apiKey, address: restaurant.streetAddress});
      }
    });
  });
  return namesAndKeys;
};



let getMenu = (apiKey, foodType, callback) => {
  let query = {
    headers: {'X-Access-Token': '0c8f1aa53d894030'},
    url: 'https://api.eatstreet.com/publicapi/v1/restaurant/' + apiKey + '/menu'
  };
  request.get(query, (error, response, body) => {
    if (error) {
      console.log('ERROR GETTING eatstreet DATA');
    } else {
      var res = JSON.parse(body);
      var splitFood = cutCommas(foodType.split(' '));
      if (!res.error) { //see bottom for error message
        menusWithRelevance(res, splitFood, function(data) {
          if (data) {
            callback(data);
          }
        });
      } else {
        setTimeout(function() {
          getMenu(apiKey, foodType, function(data) {
            if (data) {
              callback(data);
            }
          });
        }, 1000);
      }
    }
  });
};

let menusWithRelevance = (res, splitFood, callback) => {
  var menus = [];
  res.forEach( (menu) => {
    menu.items.forEach((item) => {
      var name = item.name.split(' ');
      var desc = [];
      if (item.description) {
        desc = item.description.split(' ');
      }
      var menuItem = cutCommas(desc.concat(name));
      var counter = 0;
      for (var i = 0; i < splitFood.length; i++) {
        if (menuItem.includes(splitFood[i])) {
          counter++;
        }
      }
      item.relevance = counter;
      if (item.relevance === splitFood.length) {
        menus.push(item);
      }
    });
  });
  callback(menus);
};

let formattedMenu = (apiKey, foodType, callback) => {
  var formattedData = [];
  getMenu(apiKey, foodType, (data) => {
    if (data) {
      data.forEach( (menu) => {
        formattedData.push({name: menu.name, description: menu.description || menu.name, price: menu.basePrice, relevance: menu.relevance});
      });
      callback(formattedData);
    } else {
      console.log('failed to get menu data from getMenu function');
    }
  });
};

let menusByCity = (cityName, foodType, callback) => {
  var menus = [];
  getNamesAndKeys(cityName, foodType, (restaurants) => {
    if (restaurants) {
      restaurants.forEach( (restaurant) => {
        formattedMenu(restaurant.apiKey, foodType, (menu) => {
          if (menu) {
            menu.forEach( (item) => {
              var entry = {restaurant: restaurant.name, location: restaurant.location, item: item.name, description: item.description, price: item.price, relevance: item.relevance, address: restaurant.address};
              menus.push(entry);
            });
          }
        });
      });
    }
  });
  setTimeout(function() {
    if (menus) {
      callback(menus);
    }
  }, 2500);
};


let cutCommas = (array) => {
  return array.map(word => {
    var noPunc = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    var cutStr = noPunc.replace(/\s{2,}/g, '');
    return cutStr.charAt(0).toUpperCase() + cutStr.slice(1);
  });
};



module.exports.getNamesAndKeys = getNamesAndKeys;
module.exports.getMenu = getMenu;
module.exports.formattedMenu = formattedMenu;
module.exports.menusByCity = menusByCity;


/*
response:  { error: true,
  errorCode: 429,
  details: 'Per-second rate limit exceeded'
}
*/

// let menusByCity = (cityName, foodType, callback) => {
//   var menus = [];
//   getNamesAndKeys(cityName, foodType, (restaurants) => {
//     if (restaurants) {
//       restaurants.forEach( (restaurant) => {
//         getRelevantMenus(restaurant.apiKey, foodType, (menu) => {
//           if (menu) {
//             menu.forEach( (item) => {
//               var entry = {restaurant: restaurant.name, location: restaurant.location, item: item.name, description: item.description, price: item.price, relevance: item.relevance, address: restaurant.address};
//               menus.push(entry);
//             });
//           }
//         });
//       });
//     }
//   });
//   setTimeout(function() {
//     if (menus) {
//       var groupByRestaurant = [];
//       var restaurantNames = [];
//       menus.forEach(menu => {
//         if (restaurantNames.includes(menu.restaurant)) {
//           for (var i = 0; i < groupByRestaurant.length; i++) {
//             if (groupByRestaurant[i].name === menu.restaurant) {
//               groupByRestaurant[i].items.push({
//                 'item' : menu.item,
//                 'description': menu.description,
//                 'price': menu.price
//               });
//             }
//           }
//         } else {
//           restaurantNames.push(menu.restaurant);
//           var restaurantObj = {
//               'name': menu.restaurant,
//               'items': [],
//               'address': menu.address,
//               'location': menu.location
//             };
//             restaurantObj.items.push({
//               'item': menu.item,
//               'description': menu.description,
//               'price': menu.price
//             });
//             groupByRestaurant.push(restaurantObj);
//         }
//       })
//     };
//     callback(groupByRestaurant);
//   }, 2500);
// };



///BOTH FUNCTIONS BELOW TAKE USER SEARCH RADIUS

// let getNamesAndKeys = (cityName, miles, foodType, callback) => {
//   var splitFood = foodType.split(' '); // "pepperoni pizza" --> ['pepperoni', 'pizza']
//   let query = {
//     headers: {'X-Access-Token': '0c8f1aa53d894030'},
//     url: 'https://api.eatstreet.com/publicapi/v1/restaurant/search?method=both&pickup-radius=' + miles + '&street-address=' + cityName
//   };
//   request.get(query, (error, response, body) => {
//     if (error) {
//       console.log('ERROR GETTING eatstreet DATA');
//     } else {
//       var formattedData = formatRestaurantData(body, splitFood);
//       callback(formattedData);
//     }
//   });
// };


// let menusByCity = (cityName, miles, foodType, callback) => {
//   var menus = [];
//   getNamesAndKeys(cityName, miles, foodType, (restaurants) => {
//     if (restaurants) {
//       restaurants.forEach( (restaurant) => {
//         formattedMenu(restaurant.apiKey, foodType, (menu) => {
//           if (menu) {
//             menu.forEach( (item) => {
//               var entry = {restaurant: restaurant.name, location: restaurant.location, item: item.name, description: item.description, price: item.price, relevance: item.relevance};
//               menus.push(entry);
//             });
//           }
//         });
//       });
//     }
//   });
//   setTimeout(function() {
//     if (menus) {
//       callback(menus);
//     }
//   }, 2500);
// };