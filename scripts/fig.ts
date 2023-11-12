const generator: Fig.Generator = {
  script(args) {
    console.log(args);
    return [
      "moonx",
      "_moonx_list",
      ...args.filter(
        (arg) => !arg.startsWith("-") && arg.length && "moonx" !== arg,
      ),
    ];
  },
  trigger: "moonx",
  postProcess(out) {
    console.log("here");
    const lines = out.split("\n");
    return lines.map((line) => {
      return {
        name: line,
      };
    });
  },
};

const completionSpec: Fig.Spec = {
  name: "moonx",
  args: {
    isVariadic: true,
    generators: generator,
  },
};
export default completionSpec;
