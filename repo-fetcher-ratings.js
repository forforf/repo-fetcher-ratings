'use strict';

angular.module('RepoFetcherRatings', ['GithubRepoFetcher'])

  .factory('Repo', function (GithubRepo) {
    var CONFIG = {
      ratingPrefix: "_rating_:"
    };

    var baseModel = {};

    function insertRatings(repos){
      console.debug('insertRatings', repos);
      var reposWithRatings = repos.map(function(repo){
        var desc = repo.description || '';

        var r = desc.split(CONFIG.ratingPrefix)[1];
        if(r){
          try{
            repo.__rating = JSON.parse(r);
          } catch(e) {
            repo.__rating = e;
          }
        } else {
         repo.__rating = null;
        }
        return repo;
      });
      return reposWithRatings;
    }

    function storeUserRepos(user){
      return function(repos){
        baseModel[user] = repos;
        return repos;
      }
    }

    //baseModel iterates over the raw repo data objects
    //and inserts the rating data
    function refreshBaseModel(user, filters){
      if (!(_.isArray(filters))){
        filters = [];
      }

      //adds ratings to last set of repos in filter chain
      filters.push(insertRatings);



      //fetch from github
      return GithubRepo.fetcher(user, filters)
        .then(storeUserRepos(user))

    }


    return {
      refreshBaseModel: refreshBaseModel,
      getBaseModel: null,
      viewModel: function(){}
    };
  })

  .directive('repoRating', function () {
    return {};
  });
