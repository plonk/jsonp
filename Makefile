assets.js: startup.scm repl.scm hello.scm shell.scm ls.scm echo.scm cat.scm scr.scm init.scm reset.scm vi.scm
	ruby text2js.rb $^ > assets.js
