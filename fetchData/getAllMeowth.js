const axios = require("axios");

async function inspectMeowthForms() {
  const speciesUrl = "https://pokeapi.co/api/v2/pokemon-species/meowth";

  const speciesRes = await axios.get(speciesUrl);
  const varieties = speciesRes.data.varieties;

  for (const variety of varieties) {
    const name = variety.pokemon.name;
    const url = variety.pokemon.url;

    const res = await axios.get(url);
    const mon = res.data;

    const formName = mon.forms?.[0]?.name ?? "unknown";
    const types = mon.types.map((t) => t.type.name);
    const sprite = mon.sprites.front_default;
    const isGmax = formName.includes("gmax") || name.includes("gmax");
    console.log(mon)
    console.log({
      id: mon.id,
      name,
      formName,
      types,
      sprite,
      isGmax,
    });
  }
}

inspectMeowthForms();