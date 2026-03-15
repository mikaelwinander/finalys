# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_22
  ];
  
  # Enable Docker
  services.docker.enable = true;

  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
      "google.gemini-cli-vscode-ide-companion"
    ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        npm-install = "cd finalys-app/frontend && npm i --no-audit --no-progress --timing";
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ "finalys-app/frontend/src/App.tsx" "finalys-app/frontend/src/App.ts" "finalys-app/frontend/src/App.jsx" "finalys-app/frontend/src/App.js" ];
      };
      # To run something each time the workspace is (re)started, use the `onStart` hook
      onStart = {
        start-redis = "docker run --name local-redis -p 6379:6379 -d redis || docker start local-redis";
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          cwd = "finalys-app/frontend";
          manager = "web";
        };
      };
    };
  };
}