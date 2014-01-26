'use strict';

angular.module('GithubRepoFetcher', [])

.factory('SortFn', function() {
    function sortByLowerCaseNameFn(){
      return function(repos){

        if( !(_.isArray(repos) ) ){
          console.log('Not an array');
          return repos;
        }

        repos.map(function(repo){
          if(repo && repo.name && typeof repo.name === 'string'){
            repo.__lower_case_name = repo.name.toLowerCase();
          }
        });

        var sorted =  _.sortBy(repos, '__lower_case_name');
        return sorted;

      };
    }

    function sortByRepoProp(prop, reverse){
      return function(repos){
        if( !(_.isArray(repos) ) ){
          console.log('Not an array');
          return repos;
        }

        var sorted =  _.sortBy(repos, prop);
        if (reverse){
          sorted.reverse();
        }
        return sorted;
      };
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
