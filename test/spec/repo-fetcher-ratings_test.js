'use strict';


describe('RepoFetcherRatings', function(){

  beforeEach( function(){


    //initialize module under test
    module('RepoFetcherRatings');
  });


  it('sanity check', function(){
     expect(true).toBe(true);
  });

  describe('Repo', function(){
    var repo;
    var _httpBackend;

    beforeEach(inject(function( $injector, $httpBackend, Repo){
      repo = Repo;
      _httpBackend = $httpBackend;


    }));

    it('sanity check', function(){
      expect(repo).toBeDefined();
      expect(repo.refreshBaseModel).toBeDefined();
      expect(repo.viewModel).toBeDefined();
    });

    describe('.refreshBaseModel', function(){

      describe('nominal cases', function(){
        var fetchedRepos;

        var repos = [
          { description: 'Awesome  _rating_:{"stable":5, "useful":4}' },
          { description: 'Meh  _rating_:{"stable":5, "useful":4}' },
          { description: 'Unfinished  _rating_:{"stable":5, "useful":4}' }
        ];


        beforeEach(function(){
          _httpBackend
            .when('GET', /api.github.com/)
            .respond(repos);

          repo.refreshBaseModel('foo', [])
            .then(function(repos){
              fetchedRepos = repos;
            });
        });

        it('returns collection', function(){
          fetchedRepos = null;
          _httpBackend.flush();
          expect(fetchedRepos.length).toEqual(3);
        });

        it('each item has rating object', function(){
          fetchedRepos = null;
          _httpBackend.flush();
          fetchedRepos.forEach(function(repo){
            expect(repo.__rating.stable).toEqual(5);
            expect(repo.__rating.useful).toEqual(4) ;
          });
        });
      });

      describe('abnormal cases', function(){
        describe('malformed JSON', function(){
          var fetchedRepos;

          var repos = [
            { description: 'Awesome  _rating_:{"stable":5 "useful":4}' },
            { description: 'Meh  _rating_:{""stable":5, "useful":4}' },
            { description: 'Unfinished  _rating_:{"stable":{{}, "useful":4}' }
          ];

          beforeEach(function(){
            _httpBackend
              .when('GET', /api.github.com/)
              .respond(repos);

            repo.refreshBaseModel('foo', [])
              .then(function(repos){
                fetchedRepos = repos;
              });
          });

          it('returns error object (for now at least)', function(){
            fetchedRepos = null;
            _httpBackend.flush();
            fetchedRepos.forEach(function(repo){
              expect(repo.__rating instanceof SyntaxError).toBeTruthy();
            });
          });
        });

        describe('various valid JSON', function(){
          var fetchedRepos;

          var repos = [
            { description: 'Awesome  _rating_:["stable":5, "useful":4]' },
            { description: 'Meh  _rating_:"plain string"' },
            { description: 'Unfinished  _rating_:{"a":{"stable":3}, "b":{"useful":4}}' }
          ];

          beforeEach(function(){
            _httpBackend
              .when('GET', /api.github.com/)
              .respond(repos);

            repo.refreshBaseModel('foo', [])
              .then(function(repos){
                fetchedRepos = repos;
              });
          });

          it('parses, but up to user land to handle', function(){
            fetchedRepos = null;
            _httpBackend.flush();
            fetchedRepos.forEach(function(repo){
              expect(repo.__rating).toBeDefined();
            });
          });
        });

        describe('missing _rating_: in description', function(){
          var fetchedRepos;

          var repos = [
            { description: 'Awesome' },
            { description: 'Meh  {"a":"B"}' },
            { description: 'Unfinished:{"a":"B"}' }
          ];

          beforeEach(function(){
            _httpBackend
              .when('GET', /api.github.com/)
              .respond(repos);

            repo.refreshBaseModel('foo', [])
              .then(function(repos){
                fetchedRepos = repos;
              });
          });

          it('returns rating of null', function(){
            fetchedRepos = null;
            _httpBackend.flush();
            fetchedRepos.forEach(function(repo){
              expect(repo.__rating).toBe(null);
            });
          });
        });

        describe('missing description (ie Github API change', function(){
          var fetchedRepos;

          var repos = [
            { desc: 'Awesome' },
            { desc: 'Meh  {"a":"B"}' },
            { desc: 'Unfinished:{"a":"B"}' }
          ];

          beforeEach(function(){
            _httpBackend
              .when('GET', /api.github.com/)
              .respond(repos);

            repo.refreshBaseModel('foo', [])
              .then(function(repos){
                fetchedRepos = repos;
              });
          });

          it('returns rating with ApiMismatchError', function(){
            fetchedRepos = null;
            _httpBackend.flush();
            fetchedRepos.forEach(function(repo){
              expect(repo.__rating.name).toEqual('ApiMismatchError');
            });
          });
        });
      });


//      beforeEach(inject(function($q, $timeout){
//        _timeout = $timeout;
//
//        count=0;
//        function filter(collection, name){
//          collection.push(''+name+count);
//          count+=1;
//          return collection;
//        }
//
//        function getProm(val, delay){
//          var deferred = $q.defer();
//          $timeout(function(){
//            deferred.resolve(val);
//          }, delay);
//          return deferred.promise;
//        }
//
//        delay=100;
//        initPromFn = function(){ return getProm( ['init'], delay) };
//        chain = [];
//        chain.push( function(coll){ return filter(coll, 'a'); });
//        chain.push( function(coll){ return filter(coll, 'b'); });
//        chain.push( function(coll){ return filter(coll, 'c'); });
//      }));
//
//
//      it('takes an initial collection and filters sequentially', function(){
//        var finalCollection;
//        _qChain.generator(initPromFn, chain).then( function(coll){
//          finalCollection = coll;
//        });
//
//        expect(finalCollection).not.toBeDefined();
//
//        _timeout.flush(delay+50);
//
//        var expectedCollection = ['init', 'a0', 'b1', 'c2'];
//        expect(finalCollection).toEqual( expectedCollection );
//
//      })
//
    });
  });

  xdescribe('GithubRepo', function(){
    var githubRepo;

    beforeEach(inject(function( $injector, GithubRepo){
      githubRepo = GithubRepo;
    }));

    it('sanity check', function(){
      expect(githubRepo).toBeDefined();
    });

    describe('fetcher', function(){
      var fetcher;
      var user;
      var ghUrl;
      var repos;
      var _httpBackend;

      beforeEach(inject(function($httpBackend){
        user = 'forforforf';
        ghUrl = 'https://api.github.com/users/'+user+'/repos'
        var repo1 = {name: 'a'};
        var repo2 = {name: 'b'};
        var repo3 = {name: 'c'};
        repos = [repo1, repo2, repo3];
        _httpBackend = $httpBackend;

        _httpBackend
          .when('GET', ghUrl)
          .respond(repos);

        fetcher = githubRepo.fetcher;
      }));

      it('fetches from the repo', function(){
        var fetchedRepos;

        fetcher(user).then(function(resp){
          fetchedRepos = resp;
        });

         expect(fetchedRepos).toBeUndefined();
        _httpBackend.flush();
        expect(fetchedRepos).toEqual(repos);
      });

      //I'm not able to figure out an elegant test for this
      xit('passes object params in request to url')

      it('applies filters sequentially', function(){
        var fetchedRepos;

        var chain1 = function(repos){ repos.push({name: 'd'}); return repos; };
        var chain2 = function(repos){ return repos.reverse(); };
        var chain3 = function(repos){ return repos.slice(1,3); };
        var chains = [chain1, chain2, chain3];

        var expectedRepos = [ { name : 'c' }, { name : 'b' } ];

        fetcher(user, chains).then(function(resp){
          fetchedRepos = resp;
        });

        expect(fetchedRepos).toBeUndefined();
        _httpBackend.flush();
        expect(fetchedRepos).toEqual(expectedRepos);
      })

    });
  });
});