import { proxy }  from "valtio";

const store = proxy({
  test: "test"
});

export default store;
