# -*- encoding: utf-8 -*-
require File.expand_path("lib/jekyll-awayfromhome/version", __dir__)

Gem::Specification.new do |spec|
  spec.name          = "jekyll-awayfromhome"
  spec.version       = JekyllAwayfromhome::VERSION
  spec.author        = "Patrick"
  spec.email         = ""
  spec.homepage      = "https://github.com/yourusername/jekyll-awayfromhome"
  spec.summary       = "A modern Jekyll theme optimized for GitHub Pages 3.10.0+"
  spec.description   = "A responsive, feature-rich Jekyll theme with built-in search, theming, and SEO optimization. Compatible with Jekyll 3.10.0 and later."
  spec.license       = "MIT"

  spec.files = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r!^(assets|_includes|_layouts|_sass|LICENSE|README)!i) ||
    f.match(%r!^lib/!)
  end.reject do |f|
    f.match(%r!^assets/images/(post-hero-(bonaire|mountains|philippines|slovenia)|page-hero-error-(400|403)|page-hero-archive\ copy)\.svg$!i)
  end

  spec.platform = Gem::Platform::RUBY
  spec.add_runtime_dependency "jekyll", "~> 3.10", ">= 3.10.0"
  spec.add_development_dependency "bundler"
end
