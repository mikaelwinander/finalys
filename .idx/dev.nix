# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_22
    pkgs.sudo
    pkgs.redis
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
      "bradlc.vscode-tailwindcss"
    ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        npm-install-frontend = "cd finalys-app/frontend && npm i --no-audit --no-progress --timing";
        npm-install-api = "cd finalys-app/api && npm i --no-audit --no-progress --timing";
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ "finalys-app/frontend/src/App.tsx" ];
      };
      
      # To run something each time the workspace is (re)started, use the `onStart` hook
      onStart = {
        # 1. Start native Redis silently in the background
        start-redis = "redis-server --daemonize yes";
        
        # 2. Start the API server in the background!
        start-api = "cd finalys-app/api && npm run dev";
        
        # NOTE: I highly recommend leaving your data pipeline out of here so it doesn't 
        # spam your database every time you refresh your browser! But if you ever DO 
        # want it to auto-run, you would uncomment the line below:
        # run-pipeline = "cd finalys-app && npx tsx data-pipelines/ingestion/azureToBigQueryJob.ts";
      };
    };
    
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        # 3. Automatically start your Frontend React app in the preview panel
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          cwd = "finalys-app/frontend";
          manager = "web";
        };
      };
    };
  };
}
