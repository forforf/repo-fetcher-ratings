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

      var arrArgNested = args.filter( function(i){ return _.isArray(i); });
      if(arrArgNested.length ===0){
        arrArgNested = [[]];
      }

      var arrArgs = arrArgNested.reduce(function(combined, cur){
        combined.concat(cur);
        return combined;
      });


      var optArgs = args.filter( function(i){ return objButNotAryOrFn(i) });
      if(optArgs.length>1){
        return $q.reject(new Error('Cannot initBaseModel with multiple option args'));
      }

      modelArgs.user = strArgs[0];
      modelArgs.filters = arrArgs;
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
          repo.__rating = new ApiMismatchError('API missing description field');
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
      var filters = args.filters;


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
      var filters = args.filters;
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
      getBaseModel: getBaseModel
    };
  })

  .directive('repoRatings', function(){
    return {
      restrict: 'E',
      scope: {
        repo: '='
      },
      templateUrl: 'templates/repo-list.html'
    };
  })

  .directive('repoGraph', function(){
    function link(scope, element, attrs){
      var defaultConfig = {
        indentBarsPx: 50,
        textPxFactor: 6,
        leftMarginLabel: 4,
        noDataTemplate: '<div>-- No Ratings --</div>',
        maxRatingValue: 10,
        minRatingValue: 0,
        widthPx: 150,
        heightPx: 10,
        leftIndentPx: 0,
        rightIndentPx: 50,
        ratingLabelTextSize: '0.35em'
      };

      var config = _.extend({}, scope.graphConfig||{}, defaultConfig);

      function transStr(x, y){
        return "translate("+x+"," +y+ ")";
      }

      var ratingData = scope.repo.__rating;
      if(!ratingData){
        return element.append(config.noDataTemplate);
      }

      // ratingData = {a:1, ab:2, abc:3, abcd:4, abcde:5, abcdef:6, abcdefg:7, abcdefgh: 8, abcdefghi: 9, abcdefghij:8, abcdefghijk:7, abcdefghijkl:6, abcdefghijklm:5};

      console.log('repoGraph', scope.repo.__rating);

      //data is the rating value
      var data = Object.keys(ratingData).map(function(k){
        return ratingData[k];
      });

      //labels are the rating key
      var labels = Object.keys(ratingData);

      //find the longest label
      //note: this doens't take into account font differences,
      //just raw number of characters
      var longestLabelLength = d3.max(labels, function(t){ return t.length; });
      //compute size in px for a box to hold the label
      var maxLabelSize = (longestLabelLength * config.textPxFactor);
      var maxIndent = config.indentBarsPx;
      var maxLabelSize = maxLabelSize < maxIndent ? maxLabelSize : maxIndent;


      var width = config.widthPx,
        barHeight = config.heightPx;

      var x = d3.scale.linear()
        .domain([config.minRatingValue, config.maxRatingValue])
        .range([config.leftIndentPx, width-config.rightIndentPx]);

      var chart = d3.select(element[0]).append("svg")
        .attr("width", width)
        .attr("height", barHeight * data.length);

      var rating = chart.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function(d, i) {
          return transStr(maxLabelSize, i * barHeight);
        });



      var bar = rating.append("rect")
        .attr("width", x)
        .attr("height", barHeight - 1);

      var ratingLabel = rating.append("text")
        .attr("x", config.leftMarginLabel - maxLabelSize)
        .attr("y", barHeight/2)
        .attr("dy", config.ratingLabelTextSize)
        .text(function(d,i){ return labels[i] });

      var ratingValue = rating.append("text")
        .attr("x", function(d) { return x(d) - 10; })
        .attr("y", barHeight / 2)
        .attr("dy", config.ratingLabelTextSize)
        .text(function(d, i) { return data[i]; });

    }

    return {
      restrict: 'E',
      scope: {
        repo: '='
      },
      replace: false,
      template: '<div></div>',
      link: link
    };
  });
;
