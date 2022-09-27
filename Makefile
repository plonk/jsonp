assets.js: font.txt font-2.txt font-3.txt
	ruby text2js.rb $^ > assets.js
