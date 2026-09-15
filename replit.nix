run = ["sh", "-c", "npm --prefix propertyease run dev"]
lang = nodejs
build.packages = [
  "python3",
  "python3-pip",
  "git",
  "curl",
  "wget"
]
modules = [
  "nodejs@20",
  "postgres@15"
]
