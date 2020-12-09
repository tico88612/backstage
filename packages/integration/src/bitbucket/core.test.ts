/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BitbucketIntegrationConfig } from './config';
import {
  getBitbucketDownloadUrl,
  getBitbucketFileFetchUrl,
  getBitbucketRequestOptions,
} from './core';

describe('bitbucket core', () => {
  describe('getBitbucketRequestOptions', () => {
    it('inserts a token when needed', () => {
      const withToken: BitbucketIntegrationConfig = {
        host: '',
        apiBaseUrl: '',
        token: 'A',
      };
      const withoutToken: BitbucketIntegrationConfig = {
        host: '',
        apiBaseUrl: '',
      };
      expect(
        (getBitbucketRequestOptions(withToken).headers as any).Authorization,
      ).toEqual('Bearer A');
      expect(
        (getBitbucketRequestOptions(withoutToken).headers as any).Authorization,
      ).toBeUndefined();
    });

    it('insert basic auth when needed', () => {
      const withUsernameAndPassword: BitbucketIntegrationConfig = {
        host: '',
        apiBaseUrl: '',
        username: 'some-user',
        appPassword: 'my-secret',
      };
      const withoutUsernameAndPassword: BitbucketIntegrationConfig = {
        host: '',
        apiBaseUrl: '',
      };
      expect(
        (getBitbucketRequestOptions(withUsernameAndPassword).headers as any)
          .Authorization,
      ).toEqual('Basic c29tZS11c2VyOm15LXNlY3JldA==');
      expect(
        (getBitbucketRequestOptions(withoutUsernameAndPassword).headers as any)
          .Authorization,
      ).toBeUndefined();
    });
  });

  describe('getBitbucketFileFetchUrl', () => {
    it('rejects targets that do not look like URLs', () => {
      const config: BitbucketIntegrationConfig = { host: '', apiBaseUrl: '' };
      expect(() => getBitbucketFileFetchUrl('a/b', config)).toThrow(
        /Incorrect URL: a\/b/,
      );
    });

    it('happy path for Bitbucket Cloud', () => {
      const config: BitbucketIntegrationConfig = {
        host: 'bitbucket.org',
        apiBaseUrl: 'https://api.bitbucket.org/2.0',
      };
      expect(
        getBitbucketFileFetchUrl(
          'https://bitbucket.org/org-name/repo-name/src/master/templates/my-template.yaml',
          config,
        ),
      ).toEqual(
        'https://api.bitbucket.org/2.0/repositories/org-name/repo-name/src/master/templates/my-template.yaml',
      );
    });

    it('happy path for Bitbucket Server', () => {
      const config: BitbucketIntegrationConfig = {
        host: 'bitbucket.mycompany.net',
        apiBaseUrl: 'https://bitbucket.mycompany.net/rest/api/1.0',
      };
      expect(
        getBitbucketFileFetchUrl(
          'https://bitbucket.mycompany.net/projects/a/repos/b/browse/path/to/c.yaml',
          config,
        ),
      ).toEqual(
        'https://bitbucket.mycompany.net/rest/api/1.0/projects/a/repos/b/raw/path/to/c.yaml?at=',
      );
    });
  });

  describe('getBitbucketDownloadUrl', () => {
    it('add path param if a path is specified', () => {
      const config: BitbucketIntegrationConfig = {
        host: 'bitbucket.mycompany.net',
        apiBaseUrl: 'https://api.bitbucket.mycompany.net/rest/api/1.0',
      };
      const result = getBitbucketDownloadUrl(
        'https://bitbucket.mycompany.net/projects/backstage/repos/mock/browse/docs',
        config,
      );
      expect(result).toEqual(
        'https://api.bitbucket.mycompany.net/rest/api/1.0/projects/backstage/repos/mock/archive?format=zip&prefix=backstage-mock&path=docs',
      );
    });

    it('do not add path param if no path is specified', () => {
      const config: BitbucketIntegrationConfig = {
        host: 'bitbucket.mycompany.net',
        apiBaseUrl: 'https://api.bitbucket.mycompany.net/rest/api/1.0',
      };
      const result = getBitbucketDownloadUrl(
        'https://bitbucket.mycompany.net/projects/backstage/repos/mock/browse',
        config,
      );
      expect(new URL(result).searchParams.get('format')).toEqual('zip');
      expect(new URL(result).searchParams.get('prefix')).not.toBeNull();
      expect(new URL(result).searchParams.get('path')).toBeNull();
    });

    it('do not add path param if the repository is hosted on bitbucket.org', () => {
      const config: BitbucketIntegrationConfig = {
        host: 'bitbucket.org',
        apiBaseUrl: 'https://api.bitbucket.org/2.0',
      };
      const result = getBitbucketDownloadUrl(
        'https://bitbucket.org/backstage/mock/src/master',
        config,
      );
      expect(result).toEqual(
        'https://bitbucket.org/backstage/mock/get/master.zip',
      );
    });
  });
});
