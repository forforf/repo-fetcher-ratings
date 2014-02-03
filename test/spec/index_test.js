'use strict';

describe('GithubRepoStatus', function(){
  beforeEach(module('GithubRepoStatus'));

  describe('SortFn', function(){
    var sortFn;

    beforeEach(inject(function( $injector, SortFn){
      sortFn = SortFn;
    }));

    it('sanity check', function(){
      expect(sortFn).toBeDefined();
    })
  });
});