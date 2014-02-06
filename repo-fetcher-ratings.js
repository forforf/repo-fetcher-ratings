'use strict';

angular.module('RepoFetcherRatings', ['GithubRepoFetcher'])

  .factory('Repo', function ($q, GithubRepo, qChain) {
    var CONFIG = {
      ratingPrefix: '_rating_:'
    };

    function ApiMismatchError(message) {
      this.name = 'ApiMismatchError';
      this.message = (message || '');
    }
    ApiMismatchError.prototype = Error.prototye;

    function objButNotAryOrFn(o){
      return (_.isObject(o) && !(_.isArray(o)) && !(_.isFunction(o)));
    }

    function modelArgHandler(argums){
      var modelArgs = {};
      if(argums.length<1){
        return $q.reject(new Error('Need at least one argument for initBaseMdoel'));
      }

      var args = Array.prototype.slice.call(argums);

      var strArgs = args.filter( function(i){ return _.isString(i); });
      if(strArgs.length>1){
        return $q.reject(new Error('Cannot initBaseModel with multiple users: ' + strArgs.join(', ')));
      }

      var arrArgs = args.filter( function(i){ return _.isArray(i); });
      if(arrArgs.length>1){
        var arrArgConcat = arrArgs.concat.call(arrArgs);
      }


      var optArgs = args.filter( function(i){ return objButNotAryOrFn(i) });
      if(optArgs.length>1){
        return $q.reject(new Error('Cannot initBaseModel with multiple option args'));
      }

      modelArgs.user = strArgs[0];
      modelArgs.filters = arrArgConcat;
      modelArgs.opts = optArgs[0];

      return modelArgs;
    }


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
        baseModel[user] = repos;
        return repos;
      }
    }

    //baseModel iterates over the raw repo data objects
    //and inserts the rating data
    // arguments, string - user, array - filters, object - options
    function initBaseModel(){
      // argument handler
      var args = modelArgHandler( arguments );
      var user = args.user;
      var filters = args.filter;


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
      var args = modelArgHandler( arguments );
      var user = args.user;
      var filters = args.filter;
      var opts = args.opts || {};
      var doInit = opts.init;

      if(doInit){
        // initialize direct from repo
        return initBaseModel(user, filters, opts);
      } else {

        var baseModelFn = function(){
          return $q.when(baseModel[user]);
        };
        // operate on cached repo model
        return qChain.generator(baseModelFn, filters);
      }


      //var qChain = GithubRepo.generator(x, filters)// need to implement qChain for local collection

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
