# electron-auto-update
A minimal electron app demonstrating auto-update.


1. Update version in package.json. 
2. Push commits.
3. Set the env variable `GH_TOKEN` to a generated github access token with "repo" scope.
4. From a administrative cmd prompt (not git bash), run the following:
```bash
node_modules\.bin\build --win -p always
```
5. Go to the Github release page and publish the auto generated release draft