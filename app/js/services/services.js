'use strict';

$451.app.factory('OrderStatsService', function($resource, $http) {
    // query is not necessary here. it's just an example of how to add other methods
    return $resource($451.apiURL('orderstats'));
});

$451.app.factory('OrderSearchService', function($resource, $http) {
	return $resource($451.apiURL('ordersearch'), {}, {
		'get': { method: 'GET', isArray: true }
	});
});

$451.app.factory('OrderService', function($resource, $http) {
	return $resource($451.apiURL('order/:id'), { id: '@id' });
});

$451.app.factory('CategoryService', function($resource, $rootScope, ProductService){
    var catservice = $resource($451.apiURL('category/:interopID', {interopID: '@ID'}));
    var cats = null;

    $rootScope.$on('LogoutEvent', function(event, e){
        cats = null;
    });
    $rootScope.$on('event:auth-loginRequired', function(event, e){
        cats = null;
    });

    function populateCats(){
        if(!cats){
            cats = catservice.query();
            console.log('calling api for categories');
        }else{

        }
    };
    function findCat(parent, interopID){
        if(!interopID)
            return {SubCategories: cats};
        if(parent.InteropID === interopID)
            return parent;
        var foundCat;
        for(var i = 0; i < parent.SubCategories.length; i++){
            var child = parent.SubCategories[i];
            if(child.InteropID === interopID)
                return child;

            if(child.SubCategories){
                foundCat = findCat(child, interopID)
                if(foundCat)
                    return foundCat;
            }
        }
    }
    return {
        tree: function(){
            populateCats();
            return cats;
        },
        getOne: function(interopID){
            if(!cats){ //starting session here, so no cached cats
                populateCats();
            }else{

                var foundCat = findCat({SubCategories: cats}, interopID)

                if(!foundCat) //populateCats is probably not back yet
                {
                    console.log('not found');
                    foundCat = catservice.get({ interopID: interopID }, function(){
                        foundCat.Products = ProductService.search(foundCat.InteropID, '');
                    });
                }
                if(!foundCat.Products && foundCat.InteropID)
                {
                    foundCat.Products = ProductService.search(foundCat.InteropID, '');
                }
                return foundCat;
            }
        }
    }
});

$451.app.factory('ProductService', function($resource){
    var productAPI = $resource($451.apiURL('product/:interopID'), {interopID: '@ID'}, {'search': {method: 'POST', isArray:true}});
    console.log('cached declared');

    var cachedProducts = {};//{product3: {Name:'product name', Description: 'product description'},product1: {Name:'product name1', Description: 'product description1'}, product4: {Name:'product name4', Description: 'product description 4'}};
    function findProduct(interopId){
        return cachedProducts[0];
    }
    return {
       search: function(categoryInteropID, searchTerm){
           console.log('calling product search: category:' + categoryInteropID + ' search: ' + searchTerm)

               var products = productAPI.search({'CategoryInteropID': categoryInteropID, 'SearchTerms': searchTerm}, function(){

                   for(var i = 0; i < products.length; i++){

                       if(!cachedProducts[products[i].InteropID]){
                           cachedProducts[products[i].InteropID] = (products[i]);
                        }
                    }
               });
           return products;
       },
        getOne: function(interopID){

            if(!cachedProducts[interopID]){
                return productAPI.get({interopID: interopID}, function(data){
                    cachedProducts[interopID] = data;
                });
            }
            else
                return cachedProducts[interopID];
        }
   }
});

$451.app.factory('LoginService', function($resource){
	var isAuthenticated = false;
    return $resource($451.apiURL('login'));
});
