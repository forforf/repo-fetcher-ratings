'use strict';

angular.module('GithubRepoStatus', [])

.factory('SortFn', function() {
    function validator(repos, sortFn){
      if( !(_.isArray(repos) ) ){
        console.log('Not an array');
        return repos;
      }
      return sortFn(repos);
    }

    function sortByLowerCaseNameFn(){
      var sortFn = function(repos){
        return  _.sortBy(repos, '__lower_case_name');
      };

      return validator(repos, sortFn);
    }

    function sortByRepoProp(prop){
      var sortFn = function(repos){
        return  _.sortBy(repos, prop);
      };
      return validator(repos, sortFn);
    }

    return {
      lowerCaseName: sortByLowerCaseNameFn,
      repoProperty: sortByRepoProp
    };
  })

.factory('GithubRepos', function($q) {

  function repoFetcher(username, sortFn){

    var cred = {};

    var gh = new Octokit(cred);

    var user = gh.getUser(username);

    if(typeof sortFn === 'function'){
      return $q.when(user.getRepos())
        .then( sortFn );
    }

    return $q.when(user.getRepos())
  }

  function collectionSliceFn(start,stop){
    return function(collection){
      //we want to include stop element in the collection
      return collection.slice(start, stop+1);
    };
  }

  function repoCollection(start, stop, sortFn){
    return repoFetcher('forforf', sortFn)
      .then( collectionSliceFn(start, stop) );
  }

  return {
    repoCollection: repoCollection
  };
})
