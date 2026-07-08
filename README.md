# LeTs-Care Portugal

## For developers

**Secret management**
This project uses [envoy](https://github.com/denizlg24/envoy) for secret sharing.
To install refer to the repository linked above.

To get the .env file on your machine follow the steps bellow:
    - `envy login` to login with your GitHub account
    - `envy pull` to fetch the latest .env file (it will prompt you for project and file passwords)
    - `envy encrypt -i .env` to encrypt the file locally if any changes are made
    - `envy commit -m "message"` to commit that new file
    - `envy push` to push the changes

If you are a new developer, you should request the credentials from @denizlg24 as well as request to be added as a member to the project.
