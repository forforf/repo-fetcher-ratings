'use strict';

angular.module('RepoFetcherRatings', ['GithubRepoFetcher'])

  .factory('Repo', function (GithubRepo) {
    var CONFIG = {
      ratingPrefix: '_rating_:'
    };

    function ApiMismatchError(message) {
      this.name = 'ApiMismatchError';
      this.message = (message || '');
    }
    ApiMismatchError.prototype = Error.prototye;

    var baseModel = {};

    function insertRatings(repos){
      var reposWithRatings = repos.map(function(repo){
        var desc;
        if(repo.description){
          desc = repo.description;
        } else {
          repo.__rating = new ApiMismatchError('API missing description field')
          return repo;
        }

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

    function storeUserRepos(user, filters){
      baseModel[user] = {};
      return function(repos){
        baseModel[user.repos] = repos;
        baseModel[user.fetch_filters] = filters;
        return repos;
      }
    }

    //baseModel iterates over the raw repo data objects
    //and inserts the rating data
    function initBaseModel(user, filters){
      if (!(_.isArray(filters))){
        filters = [];
      }

      //adds ratings to last set of repos in filter chain
      filters.push(insertRatings);



      //fetch from github
      return GithubRepo.fetcher(user, filters)
        .then(storeUserRepos(user, filters))

    }

    function getBaseModel(user, filters){
      var qChain = GithubRepo.generator(x, filters)// need to implement qChain for local collection

    }


    return {
      initBaseModel: initBaseModel,
      getBaseModel: getBaseModel,
      viewModel: function(){}
    };
  })

  .directive('repoRating', function () {
    return {};
  });
