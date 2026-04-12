import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import z from "zod";


const app = Fastify({
	logger: true,
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<ZodTypeProvider>().route({
	method: 'GET',
	url: "/",
	schema: {
		response: {
			200: z.object({ // quando a rota retornar 200 ira retornar essa tipagem
				message: z.string(),
			})
		}
	},
	// aqui sao os dados que a rota ira retornar
	handler: () => {
		return {
			message: "Hello World!"
		}
	}
});

app.listen({ port: Number(process.env.PORT) || 8081 }, function (err) {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});
