require('sinatra')
set :bind, '0.0.0.0'
set :port, 8080

set :public_folder, 'www'

get '/' do
  File.read(File.join('www', 'index.html'))
end