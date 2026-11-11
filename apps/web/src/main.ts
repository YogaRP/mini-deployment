import { mount } from "svelte";
// @ts-ignore Svelte component modules are resolved by the Svelte tooling.
import App from "./App.svelte";
import "./style.css";

mount(App, { target: document.getElementById("app")! });
