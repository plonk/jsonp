require 'json'

puts "$ASSETS = "
object = {}
ARGV.each do |name|
  object[name] = File.read(name)
end
print JSON.dump(object)

puts ";"
