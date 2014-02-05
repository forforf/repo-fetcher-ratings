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
      expect(repo.initBaseModel).toBeDefined();
      expect(repo.viewModel).toBeDefined();
    });

    describe('.initBaseModel', function(){

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

          repo.initBaseModel('foo', [])
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

            repo.initBaseModel('foo', [])
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

            repo.initBaseModel('foo', [])
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

            repo.initBaseModel('foo', [])
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

            repo.initBaseModel('foo', [])
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
    });

    xdescribe('.getBaseModel', function(){
      describe('nominal cases', function(){
        var fetchedRepos;
        var count;

        var repos = [
          { description: 'Awesome  _rating_:{"stable":9, "useful":8}' },
          { description: 'Meh  _rating_:{"stable":5, "useful":4}' },
          { description: 'Unfinished  _rating_:{"stable":1, "useful":6}' }
        ];

        beforeEach(function(){
          count=0;

          function fetchResponse(method, url, data, headers){
            count+=1;
            return [ 200, repos, {} ];
          }

          _httpBackend
            .when('GET', /api.github.com/)
            .respond(repos);

          repo.getBaseModel('forforforf', [])
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
//          fetchedRepos = null;
//          _httpBackend.flush();
//          fetchedRepos.forEach(function(repo){
//            expect(repo.__rating.stable).toEqual(5);
//            expect(repo.__rating.useful).toEqual(4) ;
//          });
        });
      });
    });
  });

});