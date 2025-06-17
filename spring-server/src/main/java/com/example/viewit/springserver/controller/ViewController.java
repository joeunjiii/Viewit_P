package com.example.viewit.springserver.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {
    @GetMapping({ "/", "/login", "/main", "/interview" })
    public String forwardToIndex() {
        // src/main/resources/static/index.html
        return "forward:/index.html";
    }
}
