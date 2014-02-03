'use strict';

describe('GithubRepoStatus', function(){
  beforeEach(module('GithubRepoStatus'));

  describe('qChain', function(){
    var _qChain;

    beforeEach(inject(function( $injector, qChain){
      _qChain = qChain;
    }));

    it('sanity check', function(){
      expect(_qChain).toBeDefined();
    });

    describe('.generator', function(){
      var initPromFn;
      var chain;
      var count;
      var delay;
      var _timeout;

      beforeEach(inject(function($q, $timeout){
        _timeout = $timeout;

        count=0;
        function filter(collection, name){
          collection.push(''+name+count);
          count+=1;
          return collection;
        }

        function getProm(val, delay){
          var deferred = $q.defer();
          $timeout(function(){
            deferred.resolve(val);
          }, delay);
          return deferred.promise;
        }

        delay=99;
        initPromFn = function(){ return getProm( ['init'], delay) };
        chain = [];
        chain.push( function(coll){ return filter(coll, 'a'); });
        chain.push( function(coll){ return filter(coll, 'b'); });
        chain.push( function(coll){ return filter(coll, 'c'); });
      }));


      it('takes an initial collection and filters sequentially', function(){
        var finalCollection;
        _qChain.generator(initPromFn, chain).then( function(coll){
          finalCollection = coll;
        });

        expect(finalCollection).not.toBeDefined();

        _timeout.flush(delay+50);

        var expectedCollection = ['init', 'a0', 'b1', 'c2'];
        expect(finalCollection).toEqual( expectedCollection );

      })

    });
  });

  describe('GithubRepo', function(){
    var githubRepo;

    beforeEach(inject(function( $injector, GithubRepo){
      githubRepo = GithubRepo;
    }));

    it('sanity check', function(){
      expect(githubRepo).toBeDefined();
    })
  });

});